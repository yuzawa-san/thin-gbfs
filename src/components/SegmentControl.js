import React from 'react';
import injectSheet from 'react-jss';

const styles = {
	container: {
		display: 'inline-block',
		background: 'gray'
	},
	segment: {
		display: 'inline-block'
	},
	selected: {
		background: 'black',
		color: 'white'
	}
};

class SegmentControl extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			selectedSegment: 0,
		};
	}
	
	componentDidMount() {
		this.setState({ selectedSegment: this.props.selected });
	}
	
	render() {
		const { segments, classes } = this.props;
		const segmentElements = segments.map((segment, i) => {
			const className = (i === this.state.selectedSegment) ? `${classes.segment} ${classes.selected}` : classes.segment;
			return (<div key={segment} className={className} onClick={() => this.onChange(i)}>{segment}</div>);
		});
		return (<div className={classes.container}>
			{segmentElements}
		</div>);
	}
	onChange = selectedSegment => {
		this.setState({ selectedSegment });
		this.props.onChangeSegment(selectedSegment);
	};
}

export default injectSheet(styles)(SegmentControl);