import React from 'react';
import injectSheet from 'react-jss';

const styles = {
	pick: {
		color: 'green'
	},
	drop: {
		color: 'red'
	}
};

class PointsLabel extends React.Component {
	render() {
		const { pts, prefix, suffix, classes } = this.props;
		if (!pts) {
			return (<span/>);
		}
		const correctedPts = Math.abs(pts);
		const cls = (pts < 0) ? classes.pick : classes.drop;
		return (
			<React.Fragment>
				{prefix||""}
				<span className={cls}>
					{correctedPts}{suffix||"pts"}
				</span>
			</React.Fragment>);
	}
}

export default injectSheet(styles)(PointsLabel);